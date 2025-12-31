FROM alpine:3.19

ARG CALENDARSYNC_VERSION=0.10.1
ARG TARGETARCH

RUN apk add --no-cache ca-certificates tzdata curl

# Download CalendarSync binary
RUN ARCH=$([ "$TARGETARCH" = "arm64" ] && echo "arm64" || echo "amd64") && \
    curl -fsSL "https://github.com/inovex/CalendarSync/releases/download/v${CALENDARSYNC_VERSION}/CalendarSync_${CALENDARSYNC_VERSION}_linux_${ARCH}.tar.gz" \
    | tar xz -C /usr/local/bin CalendarSync && \
    mv /usr/local/bin/CalendarSync /usr/local/bin/calendarsync && \
    chmod +x /usr/local/bin/calendarsync

RUN adduser -D -u 1000 calendarsync
USER calendarsync
WORKDIR /app

VOLUME ["/app/config", "/app/data"]

ENTRYPOINT ["/usr/local/bin/calendarsync"]
CMD ["--config", "/app/config/systeric-to-laku6.yaml"]
