const NOTE_CONTENT_MAX_LENGTH = 300;
const NOTE_TITLE_MAX_LENGTH = 200;

export interface NoteDraftErrors {
  content?: string;
  title?: string;
}

export function validateNoteDraft({ content, title }: { content: string; title: string }) {
  const errors: NoteDraftErrors = {};
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();

  if (!trimmedTitle) {
    errors.title = "Enter a title for your note.";
  } else if (trimmedTitle.length > NOTE_TITLE_MAX_LENGTH) {
    errors.title = "Use 200 characters or fewer for the title.";
  }

  if (trimmedContent.length > NOTE_CONTENT_MAX_LENGTH) {
    errors.content = "Use 300 characters or fewer for the content.";
  }

  return errors;
}
