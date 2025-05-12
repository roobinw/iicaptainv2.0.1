import { MetadataRoute } from 'next';

// TODO: Replace 'https://YOUR_APP_DOMAIN.com' with your actual application domain.
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://YOUR_APP_DOMAIN.com';

export default function sitemap(): MetadataRoute.Sitemap {
  // TODO: Dynamically generate URLs for blog posts, user profiles, team pages if applicable and public.
  // For now, listing static, publicly accessible pages.
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    // TODO: Add other public static pages like /about, /contact, /privacy-policy, /terms-of-service
    // Example:
    // {
    //   url: `${baseUrl}/privacy-policy`,
    //   lastModified: new Date(),
    //   changeFrequency: 'yearly',
    //   priority: 0.3,
    // },
  ];
}
