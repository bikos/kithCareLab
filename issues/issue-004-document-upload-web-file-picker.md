# Issue 004: Document Upload — Save Button Disabled Without File Selection (No Fallback)

## Category
- [x] UX / Usability Improvement

## Severity
- [x] Minor (Feature works as designed, but creates a poor testing/onboarding experience)

## Environment
- OS: Web
- Route: `/add/document`

## Description
The Document Upload form (`app/add/document.tsx`) enforces that both a **Title** and a **File** must be selected before the Save button is enabled:

```tsx
disabled={!title || !selectedFile || loading}
```

And the `handleSubmit` function also guards:
```tsx
if (!title.trim() || !selectedFile) {
    alert('Please provide a title and select a document');
    return;
}
```

This is correct validation logic. However, on **web**, the `expo-document-picker` (`DocumentPicker.getDocumentAsync`) may have limited browser compatibility — in some configurations it silently fails to open a file picker dialog.

## Observed Behavior During E2E Test
- Form rendered correctly showing "Select Document (PDF or Image)" button
- Button was clicked but it's unclear if file picker opened (web limitations with `expo-document-picker`)
- Save button remained disabled (grayed out)
- No error was shown to the user to explain why the button is disabled

## Expected Behavior
- On web, the file picker should reliably open a native `<input type="file">` dialog
- If picker fails to open, a meaningful error message should appear
- Alternatively, a drag-and-drop zone for web would improve usability

## Suggested Fix Steps
Add a web-specific implementation using a native `<input type="file" />` element:
```tsx
import { Platform } from 'react-native';

const pickDocument = async () => {
    if (Platform.OS === 'web') {
        // Use native file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,application/pdf';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                setSelectedFile({ uri: URL.createObjectURL(file), name: file.name, mimeType: file.type });
                if (!title) setTitle(file.name.split('.').slice(0, -1).join('.'));
            }
        };
        input.click();
    } else {
        // existing expo-document-picker logic
    }
};
```
