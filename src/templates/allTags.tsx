import React from 'react';

import Layout from '../components/layout';
import Tag from '../components/tag';

const AllTagsIndex = ({ pageContext }: { pageContext: any }) => {
  const { tags } = pageContext;
  const tagStyle = {
    showBorder: false,
    showLabel: false,
  };
  return (
    <Layout>
      <Tag style={tagStyle} tags={tags} />
    </Layout>
  );
};

export default AllTagsIndex;
