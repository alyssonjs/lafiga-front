import styles from '../styles/Card.module.css';

const Card = ({ date, title, status, characters }) => {
  return (
    <div className={`${styles.card} ${styles.pixel}`}>
      <div className={styles.cardDate}>{date}</div>
      <div className={styles.cardTitle}>{title}</div>
      <div className={`${styles.cardStatus} ${styles[status]}`}>{status}</div>
      <div className={styles.cardDescription}>
        <ul className={styles.characterList}>
          {characters.map((char, index) => (
            <li key={index}>{char}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Card;