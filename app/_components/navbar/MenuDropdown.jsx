"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "../../_context/AuthContext";
import Dropdown from "../UI/Dropdown";
import Button from "../UI/Button";
import Link from "next/link";
import styles from "../../_styles/navbar/MenuDropdown.module.css";

import MenuIcon from "../../../public/assets/icons/Menu.svg";
import CalendarIcon from "../../../public/assets/icons/Calendar.svg";
import CharacterIcon from "../../../public/assets/icons/Profile-Male.svg";
import GroupIcon from "../../../public/assets/icons/Multiple-User.svg";
import LogoutIcon from "../../../public/assets/icons/Signout-Logout.svg";
import SettingIcon from "../../../public/assets/icons/Setting.svg";

const MenuDropdown = ({}) => {
    const { role, logoutUser} = useAuth();
    const [openDropdown, setOpenDropdown] = useState(false);
    const [roleOptions, setRoleOptions] = useState([])
    
    const adminOptions = [
        {id: 1, name: 'Q. de Sessões', icon: CalendarIcon, route: '/calendar'},
        {id: 2, name: 'Personagens', icon: CharacterIcon, route: '/admin/characters'},
        {id: 3, name: 'Grupos', icon: GroupIcon, route: '/admin/groups'},
        {id: 4, name: 'Usuários', icon: GroupIcon, route: '/admin/users'},
    ];

    const playerOptions = [
        {id: 1, name: 'Q. de Sessões', icon: CalendarIcon, route: '/calendar'},
        {id: 2, name: 'Meus Personagens', icon: CharacterIcon, route: '/my_characters'},
        {id: 3, name: 'Meus Grupos', icon: GroupIcon, route: '/my_groups'},
        {id: 4, name: 'Configurações', icon: SettingIcon, route: '/config'},
    ]

    useEffect(() => {
        setRoleOptions(role === 'admin' ? adminOptions : playerOptions)
    }, [role])

    return (
        <div>
            <Dropdown
                trigger={
                    <>
                    {openDropdown ? (
                        <Button variant="highlight" status="pressed" onClick={() => setOpenDropdown(false)}>
                            <Image
                                src={MenuIcon}
                                alt="Menu"
                                width={20}
                                height={20}
                            />
                        </Button>
                    ) : (
                        <Button variant="primary" onClick={() => setOpenDropdown(true)}>
                            <Image
                                src={MenuIcon}
                                alt="Menu"
                                width={20}
                                height={20}
                                style={{ filter: "brightness(0) invert(1)" }}
                            />
                        </Button>
                    )}
                    </>
                }
                onOutsideClick={() => setOpenDropdown(false)}
                contentWidth="180px"
            >
                <div className={styles.optionsContainer}>
                    {roleOptions.map((option) => (
                        <Link href={option.route} key={option.id} className={styles.optionContainer}>
                            <Image
                                src={option.icon}
                                alt={option.name}
                                width={20}
                                height={20}
                                style={{ filter: "brightness(0) invert(1)" }}
                            />
                            <span className={styles.optionText}>{option.name}</span>
                        </Link>
                    ))}

                    <div className={styles.optionContainer}>
                        <Image
                            src={LogoutIcon}
                            alt="logout"
                            width={20}
                            height={20}
                            style={{ filter: "brightness(0) invert(1)" }}
                        />
                        <span className={styles.optionText} onClick={() => logoutUser()}>Logout</span>
                    </div>
                </div>
            </Dropdown>
        </div>
    )
}

export default MenuDropdown;