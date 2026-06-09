export function normalizeResumePath(value: string) {
  let path = value.trim();
  if (/^https?:\/\//.test(path)) {
    const marker = "/storage/v1/object/";
    const index = path.indexOf(marker);
    if (index >= 0) {
      path = path.slice(index + marker.length);
    }
  }
  path = path.replace(/^sign\//, "").replace(/^public\//, "").replace(/^resumes\//, "");
  return decodeURIComponent(path.split("?")[0]);
}