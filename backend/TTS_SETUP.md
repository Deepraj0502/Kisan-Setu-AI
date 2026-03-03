# Text-to-Speech (TTS) Setup with AWS Polly

## Overview
The Kisan Setu AI backend now supports high-quality text-to-speech using AWS Polly, providing natural-sounding voice responses in Hindi, Marathi, and English.

## Features
- **Multi-language support**: Hindi (hi-IN), Marathi (uses hi-IN), English (en-IN)
- **Neural voices**: Uses AWS Polly's neural engine for natural-sounding speech
- **Voice**: Aditi (Indian female voice)
- **Format**: MP3 audio stream

## API Endpoint

### POST `/agent/tts`

Converts text to speech audio.

**Request Body:**
```json
{
  "text": "नमस्कार, मी Kisan Setu AI आहे",
  "language": "mr"
}
```

**Parameters:**
- `text` (required): The text to convert to speech
- `language` (required): Language code - "mr" (Marathi), "hi" (Hindi), or "en" (English)

**Response:**
- Content-Type: `audio/mpeg`
- Body: MP3 audio stream

**Example using curl:**
```bash
curl -X POST http://localhost:4000/agent/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "नमस्कार", "language": "hi"}' \
  --output speech.mp3
```

## AWS Configuration

The service uses the AWS credentials configured in your environment. Make sure you have:

1. **AWS Region**: Set in `.env` as `AWS_REGION` (default: ap-south-1)
2. **AWS Credentials**: Either:
   - Environment variables: `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
   - AWS credentials file: `~/.aws/credentials`
   - IAM role (if running on EC2/Lambda)

## Required IAM Permissions

Your AWS user/role needs the following permission:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "polly:SynthesizeSpeech"
      ],
      "Resource": "*"
    }
  ]
}
```

## Voice Details

| Language | Voice ID | Language Code | Engine |
|----------|----------|---------------|--------|
| Marathi  | Aditi    | hi-IN         | Neural |
| Hindi    | Aditi    | hi-IN         | Neural |
| English  | Aditi    | en-IN         | Neural |

**Note**: AWS Polly doesn't have a native Marathi voice yet, so we use the Hindi voice (Aditi) which works well for Marathi text.

## Frontend Integration

The frontend automatically uses AWS Polly when voice replies are enabled:

1. User enables "Voice Reply" toggle
2. When agent responds, the text is sent to `/agent/tts`
3. Audio is played automatically in the browser
4. Falls back to browser speech synthesis if AWS Polly fails

## Testing

Test the TTS endpoint:
```bash
# Hindi
curl -X POST http://localhost:4000/agent/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "नमस्कार, मैं किसान सेतु हूं", "language": "hi"}' \
  --output test-hindi.mp3

# Marathi
curl -X POST http://localhost:4000/agent/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "नमस्कार, मी किसान सेतु आहे", "language": "mr"}' \
  --output test-marathi.mp3

# English
curl -X POST http://localhost:4000/agent/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, I am Kisan Setu", "language": "en"}' \
  --output test-english.mp3
```

## Cost Considerations

AWS Polly pricing (as of 2024):
- Neural voices: $16 per 1 million characters
- First 12 months (Free Tier): 5 million characters per month for neural voices

For typical usage:
- Average response: ~200 characters
- 5M characters = ~25,000 responses/month (free tier)
- After free tier: ~$0.003 per response

## Troubleshooting

### Error: "No audio stream received from Polly"
- Check AWS credentials are configured correctly
- Verify IAM permissions include `polly:SynthesizeSpeech`

### Error: "Failed to synthesize speech"
- Check AWS region is correct in `.env`
- Verify network connectivity to AWS services
- Check CloudWatch logs for detailed error messages

### Audio not playing in browser
- Check browser console for errors
- Verify CORS is configured correctly
- Try the fallback browser speech synthesis

## Future Enhancements

- Add more voice options (male/female)
- Support for SSML (Speech Synthesis Markup Language)
- Caching frequently used phrases
- Support for streaming audio
- Add native Marathi voice when available from AWS
