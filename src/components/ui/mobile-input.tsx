'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { formatPhoneNumber, unformatPhoneNumber, validatePhoneNumber } from '@/lib/validation'

export interface MobileInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string
  onChange?: (value: string, formatted: string) => void
  onValidationChange?: (isValid: boolean) => void
}

const MobileInput = React.forwardRef<HTMLInputElement, MobileInputProps>(
  ({ className, value = '', onChange, onValidationChange, ...props }, ref) => {
    const [formattedValue, setFormattedValue] = React.useState(() =>
      formatPhoneNumber(value)
    )

    React.useEffect(() => {
      setFormattedValue(formatPhoneNumber(value))
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value

      // Remove any non-digit characters except spaces
      const digitsOnly = inputValue.replace(/[^\d\s]/g, '')

      // Remove existing formatting to get clean number
      const cleanValue = unformatPhoneNumber(digitsOnly)

      // Limit to 10 digits for SA mobile numbers
      const limitedValue = cleanValue.slice(0, 10)

      // Format for display
      const formatted = formatPhoneNumber(limitedValue)

      setFormattedValue(formatted)

      // Validate the number
      const isValid = validatePhoneNumber(limitedValue)
      onValidationChange?.(isValid)

      // Call onChange with both clean and formatted values
      onChange?.(limitedValue, formatted)
    }

    return (
      <div className="relative w-full max-w-sm">
        <Input
          type="tel"
          className={cn(
            "pr-10 w-full",
            className
          )}
          placeholder="082 329 2438"
          value={formattedValue}
          onChange={handleChange}
          ref={ref}
          {...props}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <span className="text-muted-foreground text-sm">📱</span>
        </div>
      </div>
    )
  }
)

MobileInput.displayName = 'MobileInput'

export { MobileInput }