type EmojiProps = {
  symbol: string
  className?: string
}

const Emoji = ({ symbol, className = '' }: EmojiProps) => (
  <span aria-hidden="true" className={`emoji${className ? ` ${className}` : ''}`}>
    {symbol}
  </span>
)

export default Emoji
