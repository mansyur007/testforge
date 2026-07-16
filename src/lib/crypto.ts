// App-level secret encryption (spec'd in F-07, first used by F-08 to store
// notification webhook URLs). AES-256-GCM with a key derived (scrypt) from the
// app secret. Payload format: v1:<iv b64>:<tag b64>:<cipher b64>.
// NEVER log decrypted values; never return them from an API/serializer.
//
// The implementation lives in crypto-core.mjs so L-05's restore script — plain
// node on a fresh instance, no TS loader — shares this exact payload format
// rather than reimplementing it. App code keeps importing from here.
export { encrypt, isEncrypted, decrypt } from "./crypto-core.mjs";
