package handler

import (
	"bytes"
	"io"
	"mime/multipart"
	"net/http"

	"github.com/fintrack/app/internal/model"
	"github.com/gin-gonic/gin"
)

type OCRHandler struct {
	mindeeAPIKey string
}

func NewOCRHandler() *OCRHandler {
	return &OCRHandler{
		mindeeAPIKey: "md_9fCXiGiWKetbilro4QDBgdhjhc6S54X40kzDvlJscfE",
	}
}

func (h *OCRHandler) ScanReceipt(c *gin.Context) {
	file, header, err := c.Request.FormFile("document")
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Success: false,
			Error:   "File not found",
		})
		return
	}
	defer file.Close()

	result, err := h.sendToMindee(file, header.Filename)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.Data(http.StatusOK, "application/json", result)
}

func (h *OCRHandler) sendToMindee(file io.Reader, filename string) ([]byte, error) {
	apiUrl := "https://api.mindee.net/v2/products/mindee/expense_receipts/v5/predict"

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("document", filename)
	io.Copy(part, file)
	writer.Close()

	req, _ := http.NewRequest("POST", apiUrl, body)
	req.Header.Set("Authorization", "Token "+h.mindeeAPIKey)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	return io.ReadAll(resp.Body)
}
