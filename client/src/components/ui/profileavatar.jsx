import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { Camera, LoaderCircle, UserRound, X } from "lucide-react"
import { getUserPreview } from "@/services/authService"

/**
 * Reusable profile-avatar circle.
 *
 * Props:
 * - mode: "upload" | "lookup" | "display"
 * - email: email to look up when mode="lookup"
 * - file: selected File (controlled upload mode)
 * - onFileChange(file): called with a selected File, or null when removed
 * - imageUrl: existing avatar URL for display/profile-settings use
 * - size: circle size in pixels (default 88)
 * - editable: whether clicking the circle opens the file picker; defaults true for mode="upload"
 * - disabled: disables file selection
 * - accept: allowed file types (default image formats supported by the current upload flow)
 * - className: classes applied to the outer wrapper
 * - showEditBadge: show the camera badge while editable
 * - allowRemove: show a remove control for an existing/selected image
 * - onRemove: optional callback when the remove control is used
 * - alt: image alt text
 */
export default function ProfileAvatar({
    mode = "display",
    email = "",
    file = null,
    onFileChange,
    imageUrl = "",
    size = 88,
    editable = mode === "upload",
    disabled = false,
    accept = "image/jpeg,image/png,image/webp",
    className = "",
    showEditBadge = true,
    hoverEffect = true,
    cameraHoverScale = 1.2,
    allowRemove = false,
    onRemove,
    alt = "Profile avatar",
}) {
    const inputRef = useRef(null)
    const [localPreview, setLocalPreview] = useState("")
    const [remotePreview, setRemotePreview] = useState("")
    const [lookupLoading, setLookupLoading] = useState(false)
    const [lookupFailed, setLookupFailed] = useState(false)
    const [imageFailed, setImageFailed] = useState(false)
    const [fileError, setFileError] = useState("")

    // Create/revoke the temporary preview URL for a selected local file.
    useEffect(() => {
        if (!file) {
            setLocalPreview("")
            return undefined
        }

        if (!file.type?.startsWith("image/")) {
            setLocalPreview("")
            setFileError("Choose an image file for your profile picture.")
            onFileChange?.(null)
            return undefined
        }

        setFileError("")
        const objectUrl = URL.createObjectURL(file)
        setLocalPreview(objectUrl)
        return () => URL.revokeObjectURL(objectUrl)
    }, [file, onFileChange])

    // Resolve an existing avatar when a valid email is entered on the login form.
    // Debouncing avoids a request for every keystroke; AbortController prevents stale results.
    useEffect(() => {
        if (mode !== "lookup") {
            setRemotePreview("")
            setLookupLoading(false)
            setLookupFailed(false)
            return undefined
        }

        const normalizedEmail = email.trim().toLowerCase()
        const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)

        setRemotePreview("")
        setLookupFailed(false)

        if (!looksLikeEmail) {
            setLookupLoading(false)
            return undefined
        }

        const controller = new AbortController()
        setLookupLoading(true)
        const timer = setTimeout(async () => {
            try {
                const data = await getUserPreview(normalizedEmail, { signal: controller.signal })
                // Matches the current/known preview shape and the User model's profile_avatar.url.
                const url =
                    data?.preview?.avatar ||
                    data?.preview?.profile_avatar?.url ||
                    data?.preview?.profile_avatar?.secure_url ||
                    data?.preview?.avatarUrl ||
                    data?.user?.profile_avatar?.url ||
                    data?.user?.profile_avatar?.secure_url ||
                    data?.profile_avatar?.url ||
                    data?.avatarUrl ||
                    ""

                setRemotePreview(typeof url === "string" ? url : "")
                setLookupFailed(!url && data?.found === true)
            } catch (error) {
                if (!controller.signal.aborted) {
                    setRemotePreview("")
                    setLookupFailed(true)
                }
            } finally {
                if (!controller.signal.aborted) setLookupLoading(false)
            }
        }, 350)

        return () => {
            clearTimeout(timer)
            controller.abort()
        }
    }, [email, mode])

    const effectiveImageUrl = localPreview || imageUrl || remotePreview
    useEffect(() => setImageFailed(false), [effectiveImageUrl])

    const handlePick = () => {
        if (editable && !disabled) inputRef.current?.click()
    }

    const handleFileChange = (event) => {
        const selectedFile = event.target.files?.[0] ?? null
        // Permit choosing the same file again after opening the picker a second time.
        event.target.value = ""

        if (!selectedFile) return
        if (!selectedFile.type?.startsWith("image/")) {
            setFileError("Choose an image file for your profile picture.")
            return
        }

        setFileError("")
        onFileChange?.(selectedFile)
    }

    const handleRemove = (event) => {
        event.stopPropagation()
        setFileError("")
        onFileChange?.(null)
        onRemove?.()
    }

    const circleContent = (
        <>
            {effectiveImageUrl && !imageFailed ? (
                <img
                    src={effectiveImageUrl}
                    alt={alt}
                    className="absolute inset-0 h-full w-full rounded-full object-cover"
                    onError={() => setImageFailed(true)}
                />
            ) : (
                <UserRound className="h-1/2 w-1/2 text-neutral-400" strokeWidth={1.5} aria-hidden="true" />
            )}

            {lookupLoading && (
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50" aria-label="Loading profile picture">
                    <LoaderCircle className="h-5 w-5 animate-spin text-white" />
                </span>
            )}
        </>
    )

    return (
        <div className={`flex flex-col items-center ${className}`}>

            {editable ? (
                <div
                    className="relative shrink-0"
                    style={{ width: size, height: size }}
                >
                    {/* Main avatar button */}
                    <button
                        type="button"
                        onClick={handlePick}
                        disabled={disabled}
                        aria-label={
                            effectiveImageUrl
                                ? "Change profile picture"
                                : "Choose profile picture"
                        }
                        className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-neutral-700 bg-neutral-800 transition hover:border-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {circleContent}
                    </button>

                    {/* Separate camera / remove badge */}
                    {showEditBadge && !disabled && (
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();

                                if (effectiveImageUrl) {
                                    handleRemove(event);
                                } else {
                                    handlePick();
                                }
                            }}
                            aria-label={
                                effectiveImageUrl
                                    ? "Remove profile picture"
                                    : "Choose profile picture"
                            }
                            className={`absolute bottom-0 right-0 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-neutral-900 shadow transition-transform duration-200 cursor-pointer ${hoverEffect
                                    ? "hover:scale-[var(--camera-hover-scale)]"
                                    : ""
                                } ${effectiveImageUrl
                                    ? "bg-red-500 text-white"
                                    : "bg-white text-neutral-900"
                                }`}
                            style={{
                                "--camera-hover-scale": cameraHoverScale,
                            }}
                        >
                            {effectiveImageUrl ? (
                                <X className="h-4 w-4" />
                            ) : (
                                <Camera className="h-3.5 w-3.5" />
                            )}
                        </button>
                    )}
                </div>
            ) : (
                <div
                    className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-700 bg-neutral-800 transition-all duration-200 ${hoverEffect
                            ? "cursor-pointer hover:border-neutral-500 hover:shadow-lg"
                            : "cursor-default"
                        }`}
                    style={{ width: size, height: size }}
                    aria-label={alt}
                >
                    {circleContent}
                </div>
            )}


            {editable && (
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={disabled}
                    tabIndex={-1}
                    aria-label="Select profile picture"
                />
            )}

            {allowRemove && effectiveImageUrl && editable && !disabled && (
                <button
                    type="button"
                    onClick={handleRemove}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-red-400"
                >
                    <X className="h-3 w-3" /> Remove picture
                </button>
            )}

            {fileError && <p role="alert" className="mt-2 max-w-[220px] text-center text-xs text-red-400">{fileError}</p>}
            {mode === "lookup" && lookupFailed && !effectiveImageUrl && (
                <span className="sr-only">Profile picture unavailable</span>
            )}
        </div>
    )
}
