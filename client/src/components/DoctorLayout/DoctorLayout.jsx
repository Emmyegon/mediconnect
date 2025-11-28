
import styles from './DoctorLayout.module.css';

export default function DoctorLayout({ children }) {
  return (
    <div className={styles.doctorContainer}>
      <div className={styles.doctorContent}>
        {children}
      </div>
    </div>
  );
}
