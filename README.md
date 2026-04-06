# Flick

Flick is an encrypted, auto-destructing temporary file-sharing web application. It provides a simple, secure, and fast way to share files that vanish gracefully after a set period.

## Features

- **Ephemeral File Sharing**: Files are deleted automatically after a set expiration time.
- **Secure by Default**: Optional password protection for sensitive uploads.
- **Download Limits**: Restrict the number of times a file can be downloaded.
- **Strict Security Mode**: Limit downloads to 1 per unique IP address.
- **Multi-File Uploads**: Drag and drop support for single files or bundled zip archives.
- **Instant Sharing**: Generates short URLs and QR codes for quick distribution.
- **Modern Theme**: Complete Light and Dark mode support built intuitively into the polished UI.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Database**: [Prisma](https://www.prisma.io/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [Lucide React](https://lucide.dev/) for icons
- **State/Theme**: `next-themes`

## Getting Started

### Prerequisites
- Node.js 18+ 
- A supported SQL/SQLite database (configured via `.env.local` for Prisma)

### Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Initialize the database:
```bash
npm run db:push
npm run db:generate
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. **Upload**: Drag & drop your files into the main dropzone.
2. **Configure**: Set your self-destruct timer, optional password, and download limits.
3. **Share**: Click *Encrypt & Share* to receive your temporary link and QR code.
4. **Done**: Your files will automatically self-destruct once limits are reached!

---
> *Ephemeral • Secure • Instant*
