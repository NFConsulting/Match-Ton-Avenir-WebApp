import { Checkbox, FormControlLabel, Stack, TextField } from '@mui/material'

type JobsSectionProps = {
  jobs: string[]
  onJobChange: (index: number, value: string) => void
  exploring: boolean
  onToggleExploring: () => void
}

const JobsSection = ({ jobs, onJobChange, exploring, onToggleExploring }: JobsSectionProps) => (
  <Stack spacing={1.5}>
    {[0, 1, 2, 3, 4].map((idx) => (
      <TextField
        key={idx}
        label={`Métier ${idx + 1}`}
        value={jobs[idx]}
        onChange={(event) => onJobChange(idx, event.target.value)}
        fullWidth
        size="small"
      />
    ))}
    <FormControlLabel
      control={<Checkbox checked={exploring} onChange={onToggleExploring} />}
      label="Je suis encore en exploration (et c’est normal)"
    />
  </Stack>
)

export default JobsSection
