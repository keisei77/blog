import React from 'react';
import { Box, Grid } from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import { Link } from 'gatsby';
import styled from 'styled-components';

interface HeaderProps {
  title: string;
  isScrolled: boolean;
}

const StyledHeader = styled.header<{ isScrolled: boolean }>`
  background: ${props => (props.isScrolled ? '#a1c4fd' : '#fff')};
  box-shadow: ${props =>
    props.isScrolled ? '0px 0px 0.25rem rgba(0, 0, 0, 0.4)' : 'none'};
  position: sticky;
  top: 0;
  z-index: 10;
  transition: background 0.1s ease-in-out;
`;

const StyledLink = styled(Link)<{ isScrolled: boolean }>`
  color: ${props => (props.isScrolled ? '#fff' : 'inherit')};
  transition: color 0.1s ease-in-out;
`;

function Header(props: HeaderProps) {
  const { title, isScrolled } = props;

  return (
    <StyledHeader isScrolled={isScrolled}>
      <Box p={2}>
        <Grid
          container
          direction="row"
          justify="space-between"
          alignItems="center"
        >
          <Box>
            <StyledLink
              isScrolled={isScrolled}
              style={{
                display: `flex`,
                alignItems: `center`,
                boxShadow: `none`,
                textDecoration: `none`,
              }}
              to={`/`}
            >
              <HomeIcon />
              <Box ml={0.5}>{title}</Box>
            </StyledLink>
          </Box>
          {/* <Box>
            <StyledLink isScrolled={isScrolled} to="/tags">
              tags
            </StyledLink>
            <StyledLink isScrolled={isScrolled} to="/timeline">
              timeline
            </StyledLink>
            <StyledLink isScrolled={isScrolled} to="/about">
              about
            </StyledLink>
          </Box> */}
        </Grid>
      </Box>
    </StyledHeader>
  );
}

export default Header;
