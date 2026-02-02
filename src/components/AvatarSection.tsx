import { Box, FormControlLabel, Radio, RadioGroup, Stack, TextField, Typography } from '@mui/material'
import CheckboxList from './CheckboxList'
import { avatarPostures, avatarStyles, avatarTeints } from '../constants/options'

type AvatarSectionProps = {
  avatarGender: string
  onGenderChange: (value: string) => void
  avatarExpression: string
  onExpressionChange: (value: string) => void
  chosenPostures: Record<string, boolean>
  onTogglePosture: (label: string) => void
  hair: string
  onHairChange: (value: string) => void
  chosenStyles: Record<string, boolean>
  onToggleStyle: (label: string) => void
  avatarTeint: string
  onTeintChange: (value: string) => void
  avatarWords: string[]
  onWordChange: (index: number, value: string) => void
}

const AvatarSection = ({
  avatarGender,
  onGenderChange,
  avatarExpression,
  onExpressionChange,
  chosenPostures,
  onTogglePosture,
  hair,
  onHairChange,
  chosenStyles,
  onToggleStyle,
  avatarTeint,
  onTeintChange,
  avatarWords,
  onWordChange,
}: AvatarSectionProps) => (
  <Stack spacing={3}>
    <Box>
      <Typography variant="subtitle1" fontWeight={700}>
        Genre de l’avatar
      </Typography>
      <RadioGroup row value={avatarGender} onChange={(event) => onGenderChange(event.target.value)}>
        {['Féminin', 'Masculin', 'Peu importe'].map((option) => (
          <FormControlLabel key={option} value={option} control={<Radio />} label={option} />
        ))}
      </RadioGroup>
    </Box>

    <Box>
      <Typography variant="subtitle1" fontWeight={700}>
        Expression du visage
      </Typography>
      <RadioGroup
        row
        value={avatarExpression}
        onChange={(event) => onExpressionChange(event.target.value)}
      >
        {['Confiant', 'Calme', 'Inspiré', 'Curieux'].map((option) => (
          <FormControlLabel key={option} value={option} control={<Radio />} label={option} />
        ))}
      </RadioGroup>
    </Box>

    <Box>
      <Typography variant="subtitle1" fontWeight={700}>
        Posture
      </Typography>
      <CheckboxList options={avatarPostures.map((label) => ({ label }))} selected={chosenPostures} onToggle={onTogglePosture} row />
    </Box>

    <Box>
      <Typography variant="subtitle1" fontWeight={700}>
        Cheveux (longueur, style, couleur si souhaité)
      </Typography>
      <TextField
        placeholder="Ex : mi-longs, ondulés, mèches cuivrées"
        value={hair}
        onChange={(event) => onHairChange(event.target.value)}
        fullWidth
      />
    </Box>

    <Box>
      <Typography variant="subtitle1" fontWeight={700}>
        Style vestimentaire
      </Typography>
      <CheckboxList options={avatarStyles.map((label) => ({ label }))} selected={chosenStyles} onToggle={onToggleStyle} row />
    </Box>

    <Box>
      <Typography variant="subtitle1" fontWeight={700}>
        Teint de l’avatar (optionnel)
      </Typography>
      <RadioGroup row value={avatarTeint} onChange={(event) => onTeintChange(event.target.value)}>
        {avatarTeints.map((option) => (
          <FormControlLabel key={option} value={option} control={<Radio />} label={option} />
        ))}
      </RadioGroup>
    </Box>

    <Box>
      <Typography variant="subtitle1" fontWeight={700}>
        3 mots pour décrire mon avatar
      </Typography>
      <Stack spacing={1.2}>
        {[0, 1, 2].map((idx) => (
          <TextField
            key={idx}
            label={`Mot ${idx + 1}`}
            value={avatarWords[idx]}
            onChange={(event) => onWordChange(idx, event.target.value)}
            fullWidth
            size="small"
          />
        ))}
      </Stack>
    </Box>
  </Stack>
)

export default AvatarSection
