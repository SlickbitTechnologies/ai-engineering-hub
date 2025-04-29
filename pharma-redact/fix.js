    const regex = new RegExp(escapeRegExp(sensitiveText), 'g');
    redactedText = redactedText.replace(regex, '\uFEFF'.repeat(sensitiveText.length));
  }
  
  return redactedText;
}

