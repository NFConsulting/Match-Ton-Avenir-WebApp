import { Button, Stack, TextField, Typography } from '@mui/material'

type PromptPreviewProps = {
  prompt: string
  onChange: (value: string) => void
  onSend: () => void
  loading: boolean
}

const PromptPreview = ({ prompt, onChange, onSend, loading }: PromptPreviewProps) => (
  <Stack spacing={1}>
    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
      Prompt généré (envoyé à l’API)
    </Typography>
    <TextField
      value={prompt}
      onChange={(event) => onChange(event.target.value)}
      multiline
      minRows={6}
      fullWidth
      className="prompt-preview"
      placeholder="Le prompt se générera automatiquement après avoir rempli le formulaire."
    />
    <Stack direction="row" justifyContent="flex-end" spacing={2}>
      <Button variant="outlined" onClick={onSend} disabled={loading}>
        Envoyer ce prompt à l’API
      </Button>
    </Stack>
  </Stack>
)

export default PromptPreview
