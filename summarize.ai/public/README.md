# Favicon Information

To add a favicon to your Summarize.AI application:

1. Create or download a proper favicon.ico file
2. Place the favicon.ico file in the public directory
3. Next.js will automatically serve it from the root of your application

You can also use other image formats like PNG by adding them to your metadata in app/layout.tsx:

```tsx
// In app/layout.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Summarize.AI',
  description: 'Summarize Anything, Instantly!',
  icons: {
    icon: '/icon.png', // /public/icon.png
  },
}
``` 