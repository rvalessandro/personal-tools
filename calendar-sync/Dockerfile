FROM alpine:3.19

ARG CALENDARSYNC_VERSION=0.10.1
ARG TARGETARCH

RUN apk add --no-cache ca-certificates tzdata curl bash

# Download CalendarSync binary
RUN case "${TARGETARCH}" in \
        amd64) ARCH="x86_64" ;; \
        arm64) ARCH="arm64" ;; \
        *) echo "Unsupported architecture: ${TARGETARCH}" && exit 1 ;; \
    esac && \
    curl -fsSL "https://github.com/inovex/CalendarSync/releases/download/v${CALENDARSYNC_VERSION}/calendarsync_Linux_${ARCH}.tar.gz" \
    | tar xz -C /usr/local/bin calendarsync && \
    chmod +x /usr/local/bin/calendarsync

# Create non-root user
RUN adduser -D -u 1000 calendarsync
USER calendarsync

WORKDIR /app

# Config and auth storage will be mounted
VOLUME ["/app/config", "/app/data"]

ENTRYPOINT ["/usr/local/bin/calendarsync"]
CMD ["--help"]
