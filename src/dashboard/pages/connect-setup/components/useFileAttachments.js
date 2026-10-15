import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

// Both MIME types and extensions: extension-only formats like `.md` are not
// reported consistently as a MIME type across browsers, so the dialog would
// grey them out if we listed types alone.
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic', 'heif'];
const DOCUMENT_EXTENSIONS = ['txt', 'md', 'markdown', 'pdf', 'doc', 'docx', 'csv', 'rtf'];

export const ACCEPTED_TYPES = [
  'image/*',
  ...IMAGE_EXTENSIONS.map((ext) => `.${ext}`),
  'text/plain',
  'text/markdown',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
  'application/rtf',
  'text/rtf',
  ...DOCUMENT_EXTENSIONS.map((ext) => `.${ext}`),
].join(',');

const extensionOf = (name) => {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase();
};

const isImage = (file) =>
  file.type.startsWith('image/') || IMAGE_EXTENSIONS.includes(extensionOf(file.name));

const isAccepted = (file) =>
  isImage(file) || DOCUMENT_EXTENSIONS.includes(extensionOf(file.name));

let nextId = 0;

/**
 * Owns the native file picker, the drag-and-drop target, and the list of
 * selected files. Object URLs for image thumbnails are revoked on removal,
 * on clear, and on unmount.
 *
 * Returns `{ files, inputProps, dropProps, isDraggingOver, open, remove, clear }`.
 */
export default function useFileAttachments({ maxFiles = 5, maxSizeMb = 10, onError } = {}) {
  const [files, setFiles] = useState([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const inputRef = useRef(null);
  // `filesRef` is the source of truth the handlers read and write. Creating and
  // revoking object URLs is a side effect, so it must not live inside a
  // `setState` updater — StrictMode double-invokes those in dev, which would
  // leak a second URL per image and duplicate every rejection message. It also
  // lets the unmount cleanup revoke without depending on `files`. Only `commit`
  // changes `files`, and it writes the ref first, so the two never drift.
  const filesRef = useRef(files);

  const commit = useCallback((next) => {
    filesRef.current = next;
    setFiles(next);
  }, []);

  const onErrorRef = useRef(onError);
  useLayoutEffect(() => {
    onErrorRef.current = onError;
  });

  const addFiles = useCallback(
    (incoming) => {
      const candidates = Array.from(incoming ?? []);
      if (candidates.length === 0) return;

      const current = filesRef.current;
      const rejections = [];
      const accepted = [];
      let remaining = maxFiles - current.length;

      for (const file of candidates) {
        if (!isAccepted(file)) {
          rejections.push(`${file.name} isn't a supported file type.`);
        } else if (file.size > maxSizeMb * 1024 * 1024) {
          rejections.push(`${file.name} is larger than ${maxSizeMb} MB.`);
        } else if (remaining <= 0) {
          rejections.push(`${file.name} wasn't added — up to ${maxFiles} files.`);
        } else {
          remaining -= 1;
          accepted.push({
            id: `attachment-${(nextId += 1)}`,
            name: file.name,
            size: file.size,
            type: file.type,
            kind: isImage(file) ? 'image' : 'document',
            // Only accepted files get a URL, so there is nothing to revoke on
            // the rejection path.
            previewUrl: isImage(file) ? URL.createObjectURL(file) : null,
          });
        }
      }

      if (accepted.length > 0) commit([...current, ...accepted]);
      if (rejections.length > 0) onErrorRef.current?.(rejections.join(' '));
    },
    [commit, maxFiles, maxSizeMb],
  );

  const remove = useCallback(
    (id) => {
      const target = filesRef.current.find((file) => file.id === id);
      if (!target) return;
      if (target.previewUrl) URL.revokeObjectURL(target.previewUrl);
      commit(filesRef.current.filter((file) => file.id !== id));
    },
    [commit],
  );

  const clear = useCallback(() => {
    if (filesRef.current.length === 0) return;
    filesRef.current.forEach((file) => file.previewUrl && URL.revokeObjectURL(file.previewUrl));
    commit([]);
  }, [commit]);

  const open = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleChange = useCallback(
    (event) => {
      addFiles(event.target.files);
      // Without this, picking the same file twice in a row fires no `change`
      // event the second time.
      event.target.value = '';
    },
    [addFiles],
  );

  const handleDragOver = useCallback((event) => {
    if (!event.dataTransfer?.types?.includes('Files')) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    // `dragover` fires continuously while the pointer is inside, so a
    // `dragleave` from crossing into a child is corrected on the next tick.
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      setIsDraggingOver(false);
      addFiles(event.dataTransfer?.files);
    },
    [addFiles],
  );

  // A file dropped anywhere outside the target would otherwise navigate the
  // page to that file and lose the prototype's state.
  useEffect(() => {
    const swallow = (event) => event.preventDefault();
    window.addEventListener('dragover', swallow);
    window.addEventListener('drop', swallow);
    return () => {
      window.removeEventListener('dragover', swallow);
      window.removeEventListener('drop', swallow);
    };
  }, []);

  useEffect(
    () => () => {
      filesRef.current.forEach((file) => file.previewUrl && URL.revokeObjectURL(file.previewUrl));
    },
    [],
  );

  const inputProps = useMemo(
    () => ({
      ref: inputRef,
      type: 'file',
      multiple: true,
      accept: ACCEPTED_TYPES,
      onChange: handleChange,
      className: 'hidden',
      tabIndex: -1,
      'aria-hidden': true,
    }),
    [handleChange],
  );

  const dropProps = useMemo(
    () => ({
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    }),
    [handleDragOver, handleDragLeave, handleDrop],
  );

  return { files, inputProps, dropProps, isDraggingOver, open, remove, clear };
}
