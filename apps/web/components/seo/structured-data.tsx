interface OrganizationSchema {
  name: string;
  logo: string;
  url: string;
  sameAs: string[]; // Social profiles
}

export function OrganizationLD({ name, logo, url, sameAs }: OrganizationSchema) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    logo,
    url,
    sameAs
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ProductLD({ name, image, price, currency, availability }: any) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    image,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbLD({ items }: { items: { name: string; url: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
