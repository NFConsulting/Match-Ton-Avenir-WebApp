import { Box, Checkbox, FormControlLabel, FormGroup, Typography } from '@mui/material'
import type { Option } from '../types'

type CheckboxListProps = {
  options: Option[]
  selected: Record<string, boolean>
  onToggle: (label: string) => void
  row?: boolean
}

const CheckboxList = ({ options, selected, onToggle, row = false }: CheckboxListProps) => (
  <FormGroup row={row}>
    {options.map((opt) => (
      <FormControlLabel
        key={opt.label}
        control={<Checkbox checked={Boolean(selected[opt.label])} onChange={() => onToggle(opt.label)} />}
        label={
          <Box>
            <Typography variant="body1" fontWeight={600}>
              {opt.label}
            </Typography>
            {opt.helper && (
              <Typography variant="body2" color="text.secondary">
                {opt.helper}
              </Typography>
            )}
          </Box>
        }
      />
    ))}
  </FormGroup>
)

export default CheckboxList
