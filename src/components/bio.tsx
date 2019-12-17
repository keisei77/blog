/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from 'react';
import GitHubIcon from '@material-ui/icons/GitHub';
import EmailIcon from '@material-ui/icons/Email';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import Box from '@material-ui/core/Box';
import { useStaticQuery, graphql } from 'gatsby';

const Bio = () => {
  const data = useStaticQuery(graphql`
    query BioQuery {
      site {
        siteMetadata {
          author
          social {
            email
            github
          }
        }
      }
    }
  `);

  const { author, social } = data.site.siteMetadata;
  const { email, github } = social;
  return (
    <Grid>
      <Box my={1}>
        Written by <strong>{author}</strong> who lives and works in Shanghai
        building useful things.
      </Box>
      <Box height="1.5rem" my={1}>
        <Grid
          container
          direction="row"
          justify="flex-start"
          alignItems="center"
        >
          <Box display="flex" mr={0.5}>
            <EmailIcon />
          </Box>
          <Link href={`mailto:${email}`}>{email}</Link>
        </Grid>
      </Box>
      <Box height="1.5rem" my={1}>
        <Grid
          container
          direction="row"
          justify="flex-start"
          alignItems="center"
        >
          <Box display="flex" mr={0.5}>
            <GitHubIcon />
          </Box>
          <Link href={github} target="_blank" rel="noopener noreferrer">
            {github}
          </Link>
        </Grid>
      </Box>
    </Grid>
  );
};

export default Bio;
