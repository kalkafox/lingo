import { render, screen } from '@testing-library/react'

it('likes react, too!', () => {
  render(<p>foo bar</p>)

  expect(screen.getByText('foo bar')).toBeInTheDocument()
})
