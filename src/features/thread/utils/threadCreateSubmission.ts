export type AttachedFileReader = (form: HTMLFormElement) => File | null;

/** Waits for drawing integrations and then enforces the thread image rule. */
export async function prepareThreadCreateAttachment(
  form: HTMLFormElement,
  getAttachedFile: AttachedFileReader,
): Promise<File> {
  const prepareEvent = new CustomEvent("aimg:prepare-submit", {
    detail: {} as { preparing?: Promise<void> },
  });
  form.dispatchEvent(prepareEvent);
  await prepareEvent.detail.preparing;

  const file = getAttachedFile(form);
  if (!file) throw new Error("画像を選択してください");
  return file;
}
