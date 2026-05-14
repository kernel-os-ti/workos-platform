#!/usr/bin/env bash
set -euo pipefail

# Mirrors locally-built hardcoreeng/<image>:<sha> images to GHCR
# under $DOCKER_REGISTRY/$DOCKER_NAMESPACE/<image>:$TARGET_TAG (+ :latest).
#
# Required env:
#   DOCKER_NAMESPACE   GHCR namespace (e.g. github org/user slug)
# Optional env:
#   DOCKER_REGISTRY        default: ghcr.io
#   DOCKER_SOURCE_NAMESPACE default: hardcoreeng
#   DOCKER_VERSION         default: $(git rev-parse HEAD) - source SHA tag
#   TARGET_TAG             default: $GITHUB_REF_NAME or $(git describe --tags --abbrev=0)
#   ALSO_LATEST            default: true - also push :latest
#   EXTRA_SKIP             space-separated extra <name>s to skip

REGISTRY="${DOCKER_REGISTRY:-ghcr.io}"
SRC_NS="${DOCKER_SOURCE_NAMESPACE:-hardcoreeng}"

if [ -z "${DOCKER_NAMESPACE:-}" ]; then
  echo "DOCKER_NAMESPACE is required (e.g. kernel-os-ti)" >&2
  exit 1
fi
NAMESPACE=$(echo "$DOCKER_NAMESPACE" | tr '[:upper:]' '[:lower:]')

SHA="${DOCKER_VERSION:-$(git rev-parse HEAD)}"

if [ -z "${TARGET_TAG:-}" ]; then
  if [ -n "${GITHUB_REF_NAME:-}" ] && [ "${GITHUB_REF_TYPE:-}" = "tag" ]; then
    TARGET_TAG="$GITHUB_REF_NAME"
  else
    TARGET_TAG="$(git describe --tags --abbrev=0)"
  fi
fi

ALSO_LATEST="${ALSO_LATEST:-true}"

# Base images are pushed by the dedicated baseimage workflow; never mirror
# them through this service-image script.
SKIP="base base-slim rekoni-base print-base front-base preview-base ${EXTRA_SKIP:-}"

contains() {
  local needle="$1"; shift
  for w in "$@"; do [ "$w" = "$needle" ] && return 0; done
  return 1
}

push_with_retry() {
  local ref="$1"
  for n in {1..25}; do
    if docker push "$ref"; then return 0; fi
    if (( n < 25 )); then
      echo "Push of $ref failed, retrying in 5s..." >&2
      sleep 5
    fi
  done
  echo "25 push attempts failed for $ref" >&2
  return 1
}

mapfile -t images < <(docker images --format '{{.Repository}}:{{.Tag}}' \
  | grep "^${SRC_NS}/.*:${SHA}$" || true)

if [ "${#images[@]}" -eq 0 ]; then
  echo "No locally-built ${SRC_NS}/*:${SHA} images found" >&2
  exit 1
fi

echo "Mirroring ${#images[@]} image(s) -> ${REGISTRY}/${NAMESPACE}/<name>:${TARGET_TAG}"

# shellcheck disable=SC2206
SKIP_ARR=($SKIP)
for src in "${images[@]}"; do
  name="${src#${SRC_NS}/}"
  name="${name%%:*}"

  if contains "$name" "${SKIP_ARR[@]}"; then
    echo "Skipping $name (in skip list)"
    continue
  fi

  dst="${REGISTRY}/${NAMESPACE}/${name}:${TARGET_TAG}"
  echo "Tagging $src -> $dst"
  docker tag "$src" "$dst"
  push_with_retry "$dst"

  if [ "$ALSO_LATEST" = "true" ]; then
    dst_latest="${REGISTRY}/${NAMESPACE}/${name}:latest"
    docker tag "$src" "$dst_latest"
    push_with_retry "$dst_latest"
  fi
done

echo "Done."
