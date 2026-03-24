package invitation

import (
	"math/rand"
	"time"
)

// Charset: uppercase letters and numbers, excluding ambiguous characters
// Excluded: 0, O, 1, I, l
const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

func init() {
	rand.Seed(time.Now().UnixNano())
}

// GenerateCode generates a random 6-character invitation code
func GenerateCode() string {
	code := make([]byte, 6)
	for i := range code {
		code[i] = charset[rand.Intn(len(charset))]
	}
	return string(code)
}

// ValidateCode checks if a code is valid (6 characters, valid charset)
func ValidateCode(code string) bool {
	if len(code) != 6 {
		return false
	}

	for _, c := range code {
		found := false
		for _, valid := range charset {
			if c == valid {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}

	return true
}
