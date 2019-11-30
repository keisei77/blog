import React from 'react';
import { Box, Grid } from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import { Link } from 'gatsby';
import styled from 'styled-components';

interface HeaderProps {
  title: string;
  isScrolled: boolean;
}

const StyledHeader = styled.header`
  background: ${props => (props.isScrolled ? '#663399' : '#fff')};
  position: sticky;
  top: 0;
  transition: background 0.1s ease-in-out;
`;

const StyledLink = styled(Link)`
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
