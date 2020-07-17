import React from 'react';
import { Link } from 'gatsby';
import styled, { css } from 'styled-components';
import logo from '../assets/logo.png';

interface ScrollRate {
  scrollRate: number;
}

interface HeaderProps extends ScrollRate {
  title: string;
}

const SharedGradientColor = ({ scrollRate }: ScrollRate) => css`
  color: ${() => {
    const red = 116 + 136 * scrollRate;
    const green = 210 + 37 * scrollRate;
    const blue = 255 + -103 * scrollRate;

    return scrollRate ? `rgb(${red}, ${green}, ${blue})` : '#74d2ff';
  }};
`;

const StyledHeader = styled.header<{ scrollRate: number }>`
  background: ${props => `rgba(116, 210, 255, ${props.scrollRate})`};
  box-shadow: ${props =>
    props.scrollRate
      ? `0px 0px 0.25rem rgba(0, 0, 0, ${0.4 * props.scrollRate})`
      : 'none'};
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

const StyledLink = styled(Link)<{ scrollRate: number }>`
  ${SharedGradientColor};
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
  ${SharedGradientColor};
  padding: 0 8px;

  &:last-child {
    padding-right: 0;
  }
`;
const StyledAnchor = styled.a<{ scrollRate: number }>`
  ${SharedGradientColor};
  display: flex;
  align-items: center;
  transition: color 0.1s ease-in-out;
  padding: 0 8px;
`;

function Header(props: HeaderProps) {
  const { title, scrollRate } = props;

  return (
    <StyledHeader scrollRate={scrollRate}>
      <StyledHeaderContainer>
        <StyledLink scrollRate={scrollRate} to={`/`}>
          <StyledLogo src={logo} alt="logo" />
          <span className="title">{title}</span>
        </StyledLink>
        <StyledNav>
          <StyledMenu scrollRate={scrollRate} to="/tags">
            标签
          </StyledMenu>
          {/* <StyledMenu isScrolled={isScrolled} to="/timeline">
          归档
        </StyledMenu> */}
          <StyledAnchor
            scrollRate={scrollRate}
            href="https://keisei.now.sh/ncov"
            target="blank"
          >
            疫情数据
          </StyledAnchor>
          <StyledMenu scrollRate={scrollRate} to="/friends">
            友链
          </StyledMenu>
          <StyledMenu scrollRate={scrollRate} to="/about">
            关于
          </StyledMenu>
        </StyledNav>
      </StyledHeaderContainer>
    </StyledHeader>
  );
}

export default Header;
