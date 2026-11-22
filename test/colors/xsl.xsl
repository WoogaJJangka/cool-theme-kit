<?xml version="1.0" encoding="UTF-8"?>
<!-- 한글 주석 -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <html>
      <xsl:for-each select="catalog/cd[price &gt; 10]">
        <p class="title"><xsl:value-of select="title"/></p>
      </xsl:for-each>
    </html>
  </xsl:template>
</xsl:stylesheet>
