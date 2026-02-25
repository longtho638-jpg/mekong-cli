FROM odoo:17.0

# Install Vietnamese locale support & additional dependencies
USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    locales-all \
    && rm -rf /var/lib/apt/lists/*

# Set Vietnamese locale
ENV LANG=vi_VN.UTF-8
ENV LANGUAGE=vi_VN:vi
ENV LC_ALL=vi_VN.UTF-8

# Create log directory
RUN mkdir -p /var/log/odoo && chown odoo:odoo /var/log/odoo

# Custom addons mount point — mount host addons here for customization
# Pre-installed modules: l10n_vn (Vietnamese chart of accounts) installed via Odoo UI
# Or via: odoo --init l10n_vn -d odoo --stop-after-init
RUN mkdir -p /mnt/extra-addons && chown odoo:odoo /mnt/extra-addons

# Copy production config
COPY odoo.conf /etc/odoo/odoo.conf

USER odoo

# Volumes: odoo data (filestore, sessions) and extra addons
VOLUME ["/var/lib/odoo", "/mnt/extra-addons"]

EXPOSE 8069 8072

# Health check — Odoo /web/health endpoint (returns 200 when ready)
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD curl -f http://localhost:8069/web/health || exit 1
