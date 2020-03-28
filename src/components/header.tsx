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
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  padding: 1rem;
  cursor: pointer;
  width: 100vw;
  box-sizing: border-box;
  transition: background 0.1s ease-in-out;
`;

const StyledHeaderContainer = styled.span`
  display: flex;
  justify-content: space-between;
  .title {
    display: none;
  }
  @media screen and (min-width: 1200px) {
    margin: 0 calc(17.5% - 0.5rem);

    .title {
      display: inline-block;
    }
  }
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
const StyledAnchor = styled.a<{ isScrolled: boolean }>`
  color: ${props => (props.isScrolled ? '#fff' : 'inherit')};
  display: flex;
  align-items: center;
  transition: color 0.1s ease-in-out;
  padding: 0 8px;
`;

function Header(props: HeaderProps) {
  const { title, isScrolled } = props;

  return (
    <StyledHeader isScrolled={isScrolled}>
      <StyledHeaderContainer>
        <StyledLink isScrolled={isScrolled} to={`/`}>
          <StyledLogo src={logo} alt="logo" />
          <span className="title">{title}</span>
        </StyledLink>
        <StyledNav>
          <StyledMenu isScrolled={isScrolled} to="/tags">
            标签
          </StyledMenu>
          {/* <StyledMenu isScrolled={isScrolled} to="/timeline">
          归档
        </StyledMenu> */}
          <StyledAnchor
            isScrolled={isScrolled}
            href="https://keisei.now.sh/ncov"
            target="blank"
          >
            疫情数据
          </StyledAnchor>
          <StyledMenu isScrolled={isScrolled} to="/weibo">
            热搜
          </StyledMenu>
          <StyledMenu isScrolled={isScrolled} to="/about">
            关于
          </StyledMenu>
        </StyledNav>
      </StyledHeaderContainer>
    </StyledHeader>
  );
}

export default Header;
