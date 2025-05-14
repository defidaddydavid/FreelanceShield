# Docker image for FreelanceShield contract development and deployment
FROM solanalabs/rust:1.70.0

ARG DEBIAN_FRONTEND=noninteractive

ARG SOLANA_CLI="1.16.16"
ARG ANCHOR_CLI="0.28.0"
ARG NODE_VERSION="20.16.0"

ENV HOME="/root"
ENV PATH="${HOME}/.cargo/bin:${PATH}"
ENV PATH="${HOME}/.local/share/solana/install/active_release/bin:${PATH}"
ENV PATH="${HOME}/.nvm/versions/node/${NODE_VERSION}/bin:${PATH}"

# Install base utilities
RUN apt-get update -qq && apt-get install -qq \
    curl wget jq pkg-config python3-pip \
    libssl-dev libudev-dev

# Install Node.js, npm, and yarn
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
ENV NVM_DIR="${HOME}/.nvm"
RUN . $NVM_DIR/nvm.sh && \
    nvm install ${NODE_VERSION} && \
    nvm use ${NODE_VERSION} && \
    nvm alias default node && \
    npm install -g yarn && yarn --version

# Install Solana CLI
RUN sh -c "$(curl -sSfL https://release.solana.com/v${SOLANA_CLI}/install)" && \
    solana --version

# Install Anchor CLI directly (without AVM)
RUN cargo install --git https://github.com/coral-xyz/anchor --tag v${ANCHOR_CLI} anchor-cli --locked && \
    anchor --version

# Create compatibility symlinks for Agave transition
RUN mkdir -p /usr/local/bin && \
    for f in ${HOME}/.local/share/solana/install/active_release/bin/solana*; do \
        binary_name=$(basename $f); \
        agave_name=$(echo $binary_name | sed 's/solana/agave/'); \
        ln -sf $f /usr/local/bin/$agave_name; \
    done

# Create a directory for keypairs
RUN mkdir -p /app/keypairs

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

WORKDIR /app

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["bash"]
