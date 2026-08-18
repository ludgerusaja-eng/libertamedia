# Contributing to Libertamedia

Terima kasih telah berkontribusi pada Libertamedia! Repository ini adalah proyek sumber terbuka yang menerima kontribusi dari siapa saja.

## 🏛️ Code of Conduct

Proyek ini menganut prinsip \"Media Untuk Semua\" - terbuka, inklusif, dan menghargai keberagaman pendapat. Silakan:

- Berkolaborasi dengan hormat
- Menghargai perbedaan perspektif
- Fokus pada ide, bukan pribadi
- Bantu sesama kontributor

## 🚀 Getting Started

### Setup Development Environment

1. Fork repository ke GitHub account Anda
2. Clone fork Anda
```bash
git clone https://github.com/YOUR_USERNAME/libertamedia.git
cd libertamedia
```

3. Add upstream remote
```bash
git remote add upstream https://github.com/ludgerusaja-eng/libertamedia.git
```

4. Install dependencies
```bash
npm install
```

5. Create feature branch
```bash
git checkout -b feature/your-feature-name
```

## 📝 Commit Guidelines

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat` - Feature baru
- `fix` - Bug fix
- `docs` - Dokumentasi
- `style` - Formatting, missing semicolons, etc
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `test` - Adding tests
- `chore` - Maintenance

### Examples
```
feat(articles): add audio player support
fix(search): fix empty search results
docs(readme): update deployment instructions
refactor(components): extract button component
```

## 🔄 Pull Request Process

1. **Update main branch**
```bash
git fetch upstream
git rebase upstream/main
```

2. **Push to fork**
```bash
git push origin feature/your-feature-name
```

3. **Create Pull Request**
- Go to https://github.com/ludgerusaja-eng/libertamedia
- Click \"New Pull Request\"
- Select your branch
- Fill in PR template

## 🧪 Testing Requirements

### Before submitting PR:

```bash
# Type checking
npm run lint

# Build verification
npm run build

# Manual testing
npm run dev
# Test your changes thoroughly
```

### Code Quality
- ✅ TypeScript types are correct
- ✅ No console.errors or warnings
- ✅ Accessibility standards met (WCAG 2.1 AA)
- ✅ Responsive design tested (mobile, tablet, desktop)
- ✅ Error cases handled gracefully

## 🎨 Code Style

### TypeScript/React
```typescript
// Use functional components
interface ComponentProps {
  title: string;
  onClose: () => void;
}

export function MyComponent({ title, onClose }: ComponentProps) {
  return <div>{title}</div>;
}

// Use hooks
function useCustomHook() {
  const [state, setState] = useState(null);
  return { state, setState };
}

// Use arrow functions
const handleClick = () => { };

// Use const over let
const x = 10;

// Use template literals
const message = `Hello, ${name}`;
```

### CSS/Tailwind
```tsx
// Prefer Tailwind classes
<div className=\"bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow\" />

// Keep classes organized
<div className={
  `flex items-center justify-between
   p-4 rounded-lg border
   bg-white hover:bg-gray-50
   transition-colors`
} />
```

## 📚 Documentation

Perbarui dokumentasi untuk:
- Fitur baru
- API changes
- Setup changes
- Configuration changes

## 🐛 Bug Reports

Jika menemukan bug, silakan buat issue dengan:

```markdown
## Description
Deskripsi bug

## Steps to Reproduce
1. ...
2. ...

## Expected Behavior
Apa yang seharusnya terjadi

## Actual Behavior
Apa yang sebenarnya terjadi

## Environment
- OS: Windows/Mac/Linux
- Browser: Chrome/Firefox/Safari
- Version: 1.0.0
```

## 🎁 Feature Requests

Untuk feature request, buat issue dengan:

```markdown
## Feature Description
Deskripsi fitur yang diinginkan

## Use Case
Kenapa fitur ini dibutuhkan?

## Proposed Solution
Bagaimana seharusnya fitur ini bekerja?

## Alternatives
Solusi alternatif yang Anda pertimbangkan
```

## 📦 Dependencies

Sebelum menambah dependency baru:
1. Pastikan sudah tidak ada alternatif
2. Periksa ukuran bundle
3. Periksa maintenance status
4. Diskusikan di issue terlebih dahulu

## 🔒 Security

Jika menemukan kerentanan keamanan:
- **Jangan** buat public issue
- Email ke: security@libertamedia.com
- Berikan detail lengkap tentang vulnerability

## 📞 Questions?

- 💬 Buka Discussion di GitHub
- 📧 Email: dev@libertamedia.com
- 🐦 Twitter: @libertamedia

## 🙏 Recognition

Kontributor akan diakui di:
- CONTRIBUTORS.md
- Release notes
- Website credits

Terima kasih telah berkontribusi! 🎉
