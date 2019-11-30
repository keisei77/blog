import React from 'react';
import { Box, Grid } from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import { Link } from 'gatsby';

interface HeaderProps {
  title: string;
}

export default (props: HeaderProps) => {
  const { title } = props;
  return (
    <Box p={2}>
      <Grid
        container
        direction="row"
        justify="space-between"
        alignItems="center"
      >
        <Box>
          <Link
            style={{
              display: `flex`,
              alignItems: `center`,
              boxShadow: `none`,
              textDecoration: `none`,
              color: `inherit`,
            }}
            to={`/`}
          >
            <HomeIcon />
            <Box ml={0.5}>{title}</Box>
          </Link>
        </Box>
        <Box>
          <Link to="/tags">tags</Link>
          <Link to="/timeline">timeline</Link>
          <Link to="/about">about</Link>
        </Box>
      </Grid>
    </Box>
  );
};
