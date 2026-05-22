<?php

namespace AmzsCMS\GalleryBundle\Traits;

use Doctrine\ORM\Mapping as ORM;

trait DoctrineTitleSubtitleTrait
{
    /**
     * @ORM\Column(type="string", nullable=true)
     */
    private ?string $title;

    /**
     * @ORM\Column(type="string", nullable=true)
     */
    private ?string $subTitle = null;

    public function getTitle(): ?string
    {
        return $this->title ?? null;
    }

    public function setTitle(string $title): self
    {
        $this->title = $title;
        return $this;
    }

    public function getSubTitle(): ?string
    {
        return $this->subTitle;
    }

    public function setSubTitle(?string $subTitle): self
    {
        $this->subTitle = $subTitle;
        return $this;
    }
}