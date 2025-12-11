import PropTypes from 'prop-types'
import styles from './Card.module.scss'

/**
 * Reusable Card component
 * 
 * @param {string} variant - Card variant: 'default', 'elevated', 'outlined'
 * @param {boolean} hoverable - Enable hover effect
 * @param {boolean} clickable - Make card clickable
 * @param {string} className - Additional CSS classes
 * @param {function} onClick - Click handler
 * @param {ReactNode} children - Card content
 * @param {object} ...props - Other div props
 */
const Card = ({
  variant = 'default',
  hoverable = false,
  clickable = false,
  className = '',
  onClick,
  children,
  ...props
}) => {
  const cardClasses = [
    styles.card,
    styles[variant],
    hoverable && styles.hoverable,
    clickable && styles.clickable,
    className
  ].filter(Boolean).join(' ')

  const Component = clickable || onClick ? 'button' : 'div'
  const componentProps = clickable || onClick 
    ? { onClick, type: 'button', ...props }
    : props

  return (
    <Component className={cardClasses} {...componentProps}>
      {children}
    </Component>
  )
}

Card.propTypes = {
  variant: PropTypes.oneOf(['default', 'elevated', 'outlined']),
  hoverable: PropTypes.bool,
  clickable: PropTypes.bool,
  className: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
}

export default Card

