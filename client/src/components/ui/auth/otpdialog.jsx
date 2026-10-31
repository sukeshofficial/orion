import * as React from "react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { verifyOTP, resendOTP } from "@/services/authService"

export default function OTPDialog({ email, isOpen, onClose, onVerified }) {
  const navigate = useNavigate()
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [timeLeft, setTimeLeft] = useState(60)
  const [canResend, setCanResend] = useState(false)

  // Reset dialog state each time it opens for an email.
  useEffect(() => {
    if (!isOpen) return
    setOtp(["", "", "", "", "", ""])
    setError("")
    setSuccessMsg("")
    setTimeLeft(60)
    setCanResend(false)
  }, [isOpen, email])

  // Client-side resend countdown. This is not a server-enforced cooldown.
  useEffect(() => {
    if (!isOpen || canResend) return undefined

    const timer = setTimeout(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          setCanResend(true)
          return 0
        }
        return value - 1
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [isOpen, timeLeft, canResend])

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return

    const updated = [...otp]
    updated[index] = value
    setOtp(updated)
    setError("")

    if (value && index < otp.length - 1) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const handleVerify = async (event) => {
    event.preventDefault()
    setError("")
    setSuccessMsg("")

    if (!email) {
      setError("Email is missing. Close this dialog and try again.")
      return
    }

    const fullOtp = otp.join("")
    if (fullOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.")
      return
    }

    try {
      setLoading(true)
      await verifyOTP(email, fullOtp)
      setSuccessMsg("Email verified successfully!")

      setTimeout(() => {
        onClose?.()
        if (onVerified) onVerified()
        else navigate("/")
      }, 700)
    } catch (err) {
      setError(err?.response?.data?.message ?? "OTP verification failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!canResend || resending || !email) return

    setError("")
    setSuccessMsg("")

    try {
      setResending(true)
      await resendOTP(email)
      setSuccessMsg("A new OTP has been sent to your email.")
      setOtp(["", "", "", "", "", ""])
      setTimeLeft(60)
      setCanResend(false)
      document.getElementById("otp-0")?.focus()
    } catch (err) {
      setError(err?.response?.data?.message ?? "Could not resend OTP. Please try again.")
    } finally {
      setResending(false)
    }
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0")
    const remainingSeconds = (seconds % 60).toString().padStart(2, "0")
    return `${minutes}:${remainingSeconds}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose?.()
    }}>
      <DialogContent className="sm:max-w-md !rounded-xl p-6 bg-neutral-900 border border-neutral-800 text-white">
        <DialogHeader className="text-center mb-4">
          <DialogTitle className="text-lg font-semibold text-white">OTP Verification</DialogTitle>
          <DialogDescription className="text-sm text-neutral-400 mt-1">
            Enter the 6-digit code sent to <strong className="text-white">{email}</strong>.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div role="alert" className="mb-4 rounded-md bg-red-900/30 border border-red-800 px-3 py-2 text-xs text-red-400 text-center">
            {error}
          </div>
        )}
        {successMsg && (
          <div role="status" className="mb-4 rounded-md bg-green-900/30 border border-green-800 px-3 py-2 text-xs text-green-400 text-center">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleVerify}>
          <div className="flex justify-center gap-2 mb-4">
            {otp.map((digit, index) => (
              <Input
                key={index}
                id={`otp-${index}`}
                value={digit}
                onChange={(event) => handleChange(event.target.value, index)}
                className="w-12 h-12 text-center text-lg font-medium rounded-md bg-neutral-800 border-neutral-700 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                maxLength={1}
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                aria-label={`OTP digit ${index + 1}`}
              />
            ))}
          </div>

          {!canResend && (
            <p className="text-center text-xs text-neutral-400 mb-4">
              You can resend OTP in <strong className="text-white">{formatTime(timeLeft)}</strong>
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Button type="submit" className="w-full bg-white text-neutral-900 hover:bg-neutral-100" disabled={loading || resending}>
              {loading ? "Verifying…" : "Verify Email"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full flex justify-center items-center border-neutral-700 text-neutral-300 hover:bg-neutral-800"
              onClick={handleResend}
              disabled={!canResend || resending || loading}
            >
              {resending ? "Resending…" : canResend ? "Resend OTP" : `Resend OTP (${formatTime(timeLeft)})`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
