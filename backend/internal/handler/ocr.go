package handler

import (
	"bytes"
	"fmt"
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
	// Endpoint V2 untuk model ekstraksi
	apiUrl := "https://api.mindee.net/v2/products/mindee/extraction/v1/predict"
	apiKey := "md_9fCXiGiWKetbilro4QDBgdhjhc6S54X40kzDvlJscfE"

	// Gunakan Model ID Receipt yang kamu temukan tadi
	modelId := "8384815c-ad30-460e-9d03-ac9fb61147b8"

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// 1. Tambahkan File
	part, err := writer.CreateFormFile("document", filename)
	if err != nil {
		return nil, err
	}
	io.Copy(part, file)

	// 2. TAMBAHKAN MODEL_ID (Wajib di V2)
	_ = writer.WriteField("model_id", modelId)

	writer.Close()

	req, _ := http.NewRequest("POST", apiUrl, body)

	// Header V2 tetap menggunakan Token
	req.Header.Set("Authorization", "Token "+apiKey)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	resBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("Mindee V2 Error: %s", string(resBody))
	}

	return resBody, nil
}
