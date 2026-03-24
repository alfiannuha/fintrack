package handler

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/fintrack/app/internal/model"
	"github.com/gin-gonic/gin"
)

type OCRHandler struct{}

func NewOCRHandler() *OCRHandler {
	return &OCRHandler{}
}

type ReceiptData struct {
	MerchantName string        `json:"merchant_name"`
	Date         string        `json:"date"`
	TotalAmount  int64         `json:"total_amount"`
	Items        []ReceiptItem `json:"items"`
	RawText      string        `json:"raw_text"`
}

type ReceiptItem struct {
	Name   string `json:"name"`
	Amount int64  `json:"amount"`
}

func (h *OCRHandler) ScanReceipt(c *gin.Context) {
	var req struct {
		Image string `json:"image" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   "image is required",
		})
		return
	}

	imageData, err := base64.StdEncoding.DecodeString(req.Image)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   "invalid image data",
		})
		return
	}

	tmpDir := os.TempDir()
	imagePath := filepath.Join(tmpDir, fmt.Sprintf("receipt_%d.png", time.Now().Unix()))

	err = os.WriteFile(imagePath, imageData, 0644)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Error:   "failed to save image",
		})
		return
	}
	defer os.Remove(imagePath)

	text, err := h.performOCR(imagePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Error:   "OCR failed: " + err.Error(),
		})
		return
	}

	receiptData := h.parseReceiptText(text)

	c.JSON(http.StatusOK, model.SuccessResponse{
		Success: true,
		Data:    receiptData,
	})
}

func (h *OCRHandler) performOCR(imagePath string) (string, error) {
	cmd := exec.Command("tesseract", imagePath, "stdout", "-l", "eng+ind")

	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &out

	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("tesseract error: %v", err)
	}

	return out.String(), nil
}

func (h *OCRHandler) parseReceiptText(text string) *ReceiptData {
	lines := strings.Split(text, "\n")
	receipt := &ReceiptData{
		RawText: text,
		Items:   []ReceiptItem{},
	}

	var merchantLines []string
	totalAmount := int64(0)
	dateFound := false

	datePattern := regexp.MustCompile(`(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})`)
	pricePattern := regexp.MustCompile(`(?:Rp\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)`)
	totalPatterns := []string{
		"(?i)(?:total|grand total|jumlah|bayar|tagihan)[:\\s]*([\\d,]+\\.?\\d*)",
		"(?i)(?:Rp)[:\\s]*([\\d,]+\\.?\\d*)",
	}

	for i, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		if !dateFound {
			dateMatch := datePattern.FindStringSubmatch(line)
			if len(dateMatch) >= 4 {
				day := dateMatch[1]
				month := dateMatch[2]
				year := dateMatch[3]
				if len(year) == 2 {
					year = "20" + year
				}
				receipt.Date = fmt.Sprintf("%s-%s-%s", year, month, day)
				dateFound = true
			}
		}

		for _, pattern := range totalPatterns {
			re := regexp.MustCompile(pattern)
			matches := re.FindStringSubmatch(line)
			if len(matches) >= 2 {
				amountStr := strings.ReplaceAll(matches[1], ".", "")
				amountStr = strings.ReplaceAll(amountStr, ",", "")
				amount, err := strconv.ParseInt(amountStr, 10, 64)
				if err == nil && amount > totalAmount {
					totalAmount = amount
				}
			}
		}

		if i < 5 && len(line) > 3 && !strings.Contains(line, "receipt") && !strings.Contains(line, "struk") {
			if !containsNumber(line) || isLikelyMerchantName(line) {
				merchantLines = append(merchantLines, line)
			}
		}

		if isItemLine(line) {
			priceMatches := pricePattern.FindAllStringSubmatch(line, -1)
			if len(priceMatches) > 0 {
				priceStr := priceMatches[len(priceMatches)-1][1]
				priceStr = strings.ReplaceAll(priceStr, ".", "")
				priceStr = strings.ReplaceAll(priceStr, ",", "")
				amount, err := strconv.ParseInt(priceStr, 10, 64)
				if err == nil && amount > 0 && amount < 100000000 {
					itemName := strings.TrimSpace(pricePattern.ReplaceAllString(line, ""))
					itemName = strings.Trim(itemName, "- \t")
					if len(itemName) > 2 {
						receipt.Items = append(receipt.Items, ReceiptItem{
							Name:   itemName,
							Amount: amount,
						})
					}
				}
			}
		}
	}

	if len(merchantLines) > 0 {
		receipt.MerchantName = strings.Join(merchantLines[:min(len(merchantLines), 3)], " ")
	}

	receipt.TotalAmount = totalAmount

	return receipt
}

func containsNumber(s string) bool {
	_, err := strconv.ParseFloat(strings.Join(strings.Fields(s), ""), 64)
	return err == nil
}

func isLikelyMerchantName(s string) bool {
	s = strings.ToLower(s)
	merchantIndicators := []string{"restaurant", "cafe", "toko", "mini mart", "supermarket", "convenience", "store", "shop"}
	for _, indicator := range merchantIndicators {
		if strings.Contains(s, indicator) {
			return true
		}
	}
	words := strings.Fields(s)
	return len(words) >= 2 && len(words) <= 5
}

func isItemLine(s string) bool {
	pricePattern := regexp.MustCompile(`(?:Rp\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)`)
	matches := pricePattern.FindAllString(s, -1)
	if len(matches) < 1 {
		return false
	}

	s = strings.ToLower(s)
	excluded := []string{"total", "subtotal", "tax", "pajak", "discount", "bayar", "kembali", "tunai", "cash", "change"}
	for _, ex := range excluded {
		if strings.Contains(s, ex) {
			return false
		}
	}

	return true
}
