"use client";

import { deleteApiKey } from "@/app/actions/apikeys";

// Yes/cancel guard before revoking a key — deleting one immediately breaks any
// CI/integration still using it, so make it deliberate.
export function DeleteApiKeyButton({
  keyId,
  keyName,
}: {
  keyId: string;
  keyName: string;
}) {
  return (
    <form
      action={deleteApiKey}
      onSubmit={(e) => {
        if (
          !confirm(
            `Delete API key "${keyName}"? Anything using it (CI, scripts) will stop working immediately.`
          )
        )
          e.preventDefault();
      }}
    >
      <input type="hidden" name="keyId" value={keyId} />
      <button data-testid="apikey-delete" className="text-xs text-danger hover:underline">Delete</button>
    </form>
  );
}
