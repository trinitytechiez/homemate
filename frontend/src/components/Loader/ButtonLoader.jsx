import Loader from './Loader'
import styles from './ButtonLoader.module.scss'

const ButtonLoader = ({ text = 'Loading...' }) => {
  return (
    <div className={styles.buttonLoader}>
      <Loader size="small" text={text} />
    </div>
  )
}

export default ButtonLoader

