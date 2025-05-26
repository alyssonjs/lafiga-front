import { render, screen, fireEvent } from '@testing-library/react'
import Select from '../app/_components/Select'

const options = [
  { id: 1, name: 'Option 1' },
  { id: 2, name: 'Option 2' }
]

test('renders placeholder and selects option', () => {
  const handleChange = jest.fn()
  render(<Select placeholder="Escolha" options={options} onChange={handleChange} />)

  expect(screen.getByText('Escolha')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button'))
  fireEvent.click(screen.getByText('Option 2'))

  expect(handleChange).toHaveBeenCalledWith(2)
})
