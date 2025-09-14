import { useState } from 'react'
import { Box, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material'
import { parseCookieString } from '../utils/cookies'

export default function CookieForm({ initialValue, onSave }: { initialValue?: string; onSave: (cookie: string) => void }) {
  const [value, setValue] = useState(initialValue ?? '')
  const parsed = value ? parseCookieString(value) : null
  const valid = Boolean(parsed?.auth_token && parsed?.ajs_group_id)

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h5">Paste your Sortly cookie string</Typography>
          <TextField
            label="Cookie"
            placeholder="auth_token=...; ajs_group_id=...; ..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            multiline
            minRows={4}
            fullWidth
          />
          <Box>
            <Typography variant="body2" color={valid ? 'success.main' : 'text.secondary'}>
              {parsed?.auth_token ? 'auth_token found' : 'auth_token missing'} | {parsed?.ajs_group_id ? `company_id: ${parsed.ajs_group_id}` : 'ajs_group_id missing'}
            </Typography>
          </Box>
          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button variant="contained" disabled={!valid} onClick={() => onSave(value)}>
              Save Cookie
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  )
}

