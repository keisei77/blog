import React from 'react';
import { Link } from 'gatsby';
import styled from 'styled-components';
import logo from '../assets/logo.png';

interface HeaderProps {
  title: string;
  isScrolled: boolean;
}

const StyledHeader = styled.header<{ isScrolled: boolean }>`
  background: ${props => (props.isScrolled ? '#74d2ff' : '#fff')};
  box-shadow: ${props =>
    props.isScrolled ? '0px 0px 0.25rem rgba(0, 0, 0, 0.4)' : 'none'};
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 1rem;
  cursor: pointer;
  transition: background 0.1s ease-in-out;
  display: flex;
  justify-content: space-between;
`;

const StyledNav = styled.nav`
  display: flex;
  margin: unset;
  padding: unset;
`;

const StyledLink = styled(Link)<{ isScrolled: boolean }>`
  color: ${props => (props.isScrolled ? '#fff' : 'inherit')};
  display: flex;
  align-items: center;
  transition: color 0.1s ease-in-out;
`;

const StyledLogo = styled.img`
  padding-right: 1rem;
  height: 2rem;
  width: 4rem;
`;

const StyledMenu = styled(StyledLink)`
  padding: 0 8px;

  &:last-child {
    padding-right: 0;
  }
`;

function Header(props: HeaderProps) {
  const { title, isScrolled } = props;

  return (
    <StyledHeader isScrolled={isScrolled}>
      <StyledLink isScrolled={isScrolled} to={`/`}>
        <StyledLogo src={logo} alt="logo" />
        {title}
      </StyledLink>
      <StyledNav>
        <StyledMenu isScrolled={isScrolled} to="/tags">
          标签
        </StyledMenu>
        <StyledMenu isScrolled={isScrolled} to="/timeline">
          归档
        </StyledMenu>
        <StyledMenu isScrolled={isScrolled} to="/about">
          关于
        </StyledMenu>
      </StyledNav>
    </StyledHeader>
  );
}

export default Header;
