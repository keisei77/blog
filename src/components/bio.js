/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from 'react';
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
    <div>
      <p>
        Written by <strong>{author}</strong> who lives and works in Shanghai
        building useful things.
      </p>
      <p>
        Email: <a href={`mailto:${email}`}>{email}</a>
      </p>
      <p>
        Github:{' '}
        <a href={github} target="_blank" rel="noopener noreferrer">
          {github}
        </a>
      </p>
    </div>
  );
};

export default Bio;
