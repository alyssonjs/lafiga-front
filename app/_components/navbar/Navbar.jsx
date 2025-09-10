'use client'

import Link from "next/link";
import styles from "../../_styles/navbar/NavBar.module.css";
import Image from "next/image";
import LoginButton from "./LoginButton";
import MenuDropdown from "./MenuDropdown"
import { useAuth } from "../../_context/AuthContext";

import logo from "../../../public/lafiga_horz_filled.svg";

const Navbar = () => {
  const { user } = useAuth();

  return (
    <div className={styles.navbar}>
      <div className={styles.navbarBrand}>
        <Link href="/">
          <Image
            src={logo}
            alt="Lafiga Logo"
            width={150}
            height={100}
            className={styles.navbarLogo}
            priority
          />
        </Link>
      </div>

      <div className={styles.navbarMenu}>
        { !user ?
          <LoginButton /> : <MenuDropdown />
        }
      </div>
    </div>
  );
};

export default Navbar;
