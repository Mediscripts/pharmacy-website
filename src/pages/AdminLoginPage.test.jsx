import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import AdminLoginPage from './AdminLoginPage'
import { AuthContext } from '../context/authContext'

describe('AdminLoginPage', () => {
  it('shows an error for invalid credentials', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ login: async () => ({ success: false, message: 'Invalid admin credentials' }), isAdmin: false, loading: false }}>
          <AdminLoginPage />
        </AuthContext.Provider>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrong-password')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/invalid admin credentials/i)).toBeInTheDocument()
  })
})
